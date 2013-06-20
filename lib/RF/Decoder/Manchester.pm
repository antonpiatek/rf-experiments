use strict;
use warnings;
package RF::Decoder::Manchester;

use base 'RF::Decoder::Base';
use RF::Bits;

use constant {
  DEBUG => $ENV{RF_DECODER_MANCHESTER_DEBUG},
  STATE_FREE => 0,
  STATE_DECODING => 1,
};
use constant {
  STATE_FREE => 0,
  STATE_GAP => 1,
  STATE_DATA => 2,
};

# Electrisave: min => 300, max => 1200, mid => 750
sub new {
  shift->SUPER::new(_state => STATE_FREE, @_);
}

sub recognize {
  my ($self, $value, $index, $cb) = @_;
  if ($self->is_state(STATE_FREE)) {
    if ($value > $self->{min} && $value < $self->{max}) {
      $self->set_state(STATE_DECODING);
      $self->{v} = [ $value ];
    }
  } else {
    if ($value > $self->{min} && $value < $self->{max}) {
      push @{$self->{v}}, $value;
    } else {
      $self->set_state(STATE_FREE);
      my $num = scalar @{$self->{v}};
      warn "E $index $num: ", (join ',', @{$self->{v}}), "\n" if ($num > 10);
    }
  }
}

1;
