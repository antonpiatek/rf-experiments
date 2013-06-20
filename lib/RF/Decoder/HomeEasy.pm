use strict;
use warnings;
package RF::Decoder::HomeEasy;

use base 'RF::Decoder::Base';
use RF::Utils qw/within_error_margin/;
use RF::Bits;

use constant {
  DEBUG => $ENV{RF_DECODER_HOMEEASY_DEBUG},
  STATE_FREE => 0,
  STATE_LOW => 1,
  STATE_HIGH => 2,
  STATE_DATA => 3,
};

sub new {
  shift->SUPER::new(_state => STATE_FREE, @_);
}

sub recognize {
  my ($self, $value, $index, $cb) = @_;
  if ($self->is_state(STATE_FREE) &&
      within_error_margin($value, 11520)) {
    warn "found gap $index: $value\n" if DEBUG;
    $self->{start} = $index;
    $self->set_state(STATE_LOW);
  } elsif ($self->is_state(STATE_LOW)) {
    if (within_error_margin($value, 180)) {
      warn "found gap low $index: $value\n" if DEBUG;
      $self->set_state(STATE_HIGH);
      $self->{_bits} = RF::Bits->new;
    } else {
      warn "low not found $index: $value\n" if DEBUG;
      $self->set_state(STATE_FREE);
    }
  } elsif ($self->is_state(STATE_HIGH)) {
    if (within_error_margin($value, 2580)) {
      warn "found gap high $index: $value\n" if DEBUG;
      $self->set_state(STATE_DATA);
      $self->{_bits} = RF::Bits->new;
      $self->set_high(0);
    } else {
      warn "high not found $index: $value\n" if DEBUG;
      $self->set_state(STATE_FREE);
    }
  } elsif ($self->is_state(STATE_DATA)) {
    if ($self->is_high) {
      if (within_error_margin($value, 1260)) {
        if (defined $self->{last_bit} && $self->{last_bit} == 0) {
          warn "found 0 $index: $value\n" if DEBUG;
          $self->{_bits}->add_bit(0);
          delete $self->{last_bit};
        } elsif (defined $self->{last_bit}) {
          warn "found two 1s $index: $value\n" if DEBUG;
          $self->set_state(STATE_FREE);
        } else {
          $self->{last_bit} = 1;
        }
      } elsif (within_error_margin($value, 260)) {
        if (defined $self->{last_bit} && $self->{last_bit} == 1) {
          warn "found 1 $index: $value\n" if DEBUG;
          $self->{_bits}->add_bit(1);
          delete $self->{last_bit};
        } elsif (defined $self->{last_bit}) {
          warn "found two 0s $index: $value\n" if DEBUG;
          $self->set_state(STATE_FREE);
        } else {
          $self->{last_bit} = 0;
        }
      } else {
        warn "invalid high $index: $value\n" if DEBUG;
        $self->set_state(STATE_FREE);
      }
      if ($self->{_bits}->length == 32) {
        warn 'Found ', $self->{start}, '-', $index, ': ',
          $self->{_bits}->pretty, "\n" if DEBUG;
        $self->process_bits($self->{_bits}, $cb);
        $self->set_state(STATE_FREE);
        return;
      }
    } elsif (within_error_margin($value, 220)) {
      # correct low
    } else {
      warn "invalid low $index: $value\n" if DEBUG;
      $self->set_state(STATE_FREE);
    }
    $self->toggle_high_low;
  }
}

sub process_bits {
  my ($self, $bits, $cb) = @_;
  my $bytes = $bits->bytes;
  $cb->($bytes);
}

1;
