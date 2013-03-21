use strict;
use warnings;
package RF::Bits;

# ABSTRACT: Module to store bits collected by RF decoding

=head1 SYNOPSIS

  use RF::Bits;
  my $b = RF::Bits->new;
  $b->add_bit(1);
  print $b->length, "\n"; # 1
  print $b->byte(0), "\n"; # 128 (0x80)
  print $b->byte_length, "\n"; # 1
  print $b->pretty, "\n";
  $b->add_bit(0);
  $b->add_bit(1);
  print $b->length, "\n"; # 3
  print $b->byte(0), "\n"; # 160 (0xa0)
  print $b->byte_length, "\n"; # 1
  print $b->pretty, "\n";

=cut

sub new {
  my $pkg = shift;
  bless { _len => 0, _bytes => [0], @_ }, $pkg;
}

sub add_bit {
  my ($self, $value) = @_;
  $self->{_len}++;
  return unless ($value);
  my $l = $self->{_len}-1;
  my $byte = int($l/8);
  my $bit = $l%8;
  $self->{_bytes}->[$byte] |= 2**(7-$bit);
}

sub byte {
  my ($self, $i) = @_;
  $i //= 0;
  $self->{_bytes}->[$i];
}

sub length {
  shift->{_len};
}

sub byte_length {
  scalar @{shift->bytes}
}

sub bytes {
  shift->{_bytes}
}

sub pretty {
  my $self = shift;
  sprintf(("%02x " x $self->byte_length), @{$self->bytes});
}

sub pretty_binary {
  my $self = shift;
  sprintf(("%08b " x $self->byte_length), @{$self->bytes});
}

1;
